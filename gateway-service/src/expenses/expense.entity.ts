import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

@Entity('cloud_expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'text' })
  provider: string; // 'GCP', 'AWS', 'Stripe'

  @Column({ name: 'service_name', type: 'text' })
  serviceName: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  cost: number;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamp with time zone' })
  recordedAt: Date;
}
