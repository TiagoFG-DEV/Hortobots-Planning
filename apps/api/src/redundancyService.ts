import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseEnabled } from './storageService.js';

export interface DatabaseInstanceStatus {
  name: string;
  role: 'primary' | 'backup';
  url: string;
  configured: boolean;
  connected: boolean;
  lastChecked: string;
  latencyMs?: number;
  error?: string;
}

export interface RedundancyStatus {
  enabled: boolean;
  activeInstance: 'primary' | 'backup';
  primary: DatabaseInstanceStatus;
  backup: DatabaseInstanceStatus;
  pendingSyncCount: number;
  lastSyncAt?: string;
  mode: 'standalone' | 'active-passive' | 'fallback';
}

export class RedundancyService {
  private static instance: RedundancyService;
  private backupClient: SupabaseClient | null = null;
  private backupEnabled: boolean = false;
  private primaryUrl: string = '';
  private backupUrl: string = '';
  private lastSyncAt: string | null = null;

  private constructor() {
    this.primaryUrl = process.env.SUPABASE_URL || '';
    this.backupUrl = process.env.SUPABASE_BACKUP_URL || process.env.BACKUP_SUPABASE_URL || '';
    this.backupEnabled = (process.env.BACKUP_DATABASE_ENABLED === 'true' || Boolean(this.backupUrl));

    const backupKey = process.env.SUPABASE_BACKUP_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (this.backupUrl && backupKey) {
      try {
        this.backupClient = createClient(this.backupUrl, backupKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
      } catch (err) {
        console.warn('Falha ao inicializar cliente de backup:', err);
      }
    }
  }

  public static getInstance(): RedundancyService {
    if (!RedundancyService.instance) {
      RedundancyService.instance = new RedundancyService();
    }
    return RedundancyService.instance;
  }

  /**
   * Diagnostico e estado de saude das instancias do banco de dados
   */
  public async getStatus(): Promise<RedundancyStatus> {
    const primaryStatus: DatabaseInstanceStatus = {
      name: 'Supabase Principal (gpqqqnhpadbgiolfyplx)',
      role: 'primary',
      url: this.primaryUrl ? this.maskUrl(this.primaryUrl) : 'nao configurado',
      configured: Boolean(this.primaryUrl),
      connected: false,
      lastChecked: new Date().toISOString()
    };

    const backupStatus: DatabaseInstanceStatus = {
      name: 'Supabase Backup (rxfdjwdfinhqdwllzmcc)',
      role: 'backup',
      url: this.backupUrl ? this.maskUrl(this.backupUrl) : 'nao configurado',
      configured: this.backupEnabled && Boolean(this.backupUrl),
      connected: false,
      lastChecked: new Date().toISOString()
    };

    // 1. Testa conexao primaria
    if (supabase) {
      const start = Date.now();
      try {
        const { error } = await supabase.from('records').select('id').limit(1);
        primaryStatus.latencyMs = Date.now() - start;
        if (!error) {
          primaryStatus.connected = true;
        } else {
          primaryStatus.error = error.message;
        }
      } catch (err) {
        primaryStatus.error = err instanceof Error ? err.message : String(err);
      }
    }

    // 2. Testa conexao backup
    if (this.backupClient) {
      const start = Date.now();
      try {
        const { error } = await this.backupClient.from('records').select('id').limit(1);
        backupStatus.latencyMs = Date.now() - start;
        if (!error) {
          backupStatus.connected = true;
        } else {
          backupStatus.error = error.message;
        }
      } catch (err) {
        backupStatus.error = err instanceof Error ? err.message : String(err);
      }
    }

    let mode: 'standalone' | 'active-passive' | 'fallback' = 'standalone';
    if (primaryStatus.connected && backupStatus.connected) {
      mode = 'active-passive';
    } else if (!primaryStatus.connected && backupStatus.connected) {
      mode = 'fallback';
    }

    return {
      enabled: this.backupEnabled,
      activeInstance: primaryStatus.connected ? 'primary' : 'backup',
      primary: primaryStatus,
      backup: backupStatus,
      pendingSyncCount: 0,
      lastSyncAt: this.lastSyncAt || undefined,
      mode
    };
  }

  /**
   * Sincroniza uma entidade replicando as gravacoes para o banco secundario quando disponivel
   */
  public async replicateMutation(table: string, action: 'upsert' | 'delete', recordOrId: any): Promise<boolean> {
    if (!this.backupClient || !this.backupEnabled) {
      return false;
    }

    try {
      if (action === 'upsert') {
        const { error } = await this.backupClient.from(table).upsert(recordOrId);
        if (error) {
          console.warn(`Erro na replicacao para o backup (${table}):`, error.message);
          return false;
        }
      } else if (action === 'delete') {
        const { error } = await this.backupClient.from(table).delete().eq('id', recordOrId);
        if (error) {
          console.warn(`Erro na replicacao de exclusao para o backup (${table}):`, error.message);
          return false;
        }
      }
      this.lastSyncAt = new Date().toISOString();
      return true;
    } catch (err) {
      console.warn(`Falha na comunicacao com o banco de backup (${table}):`, err);
      return false;
    }
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}`;
    } catch {
      return url.replace(/:[^:@]+@/, ':***@');
    }
  }
}

export const redundancyService = RedundancyService.getInstance();

