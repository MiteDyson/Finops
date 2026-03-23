import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_name', type: 'text' })
  companyName: string;

  @Column({ name: 'jira_domain', type: 'text', nullable: true })
  jiraDomain: string;

  @Column({ name: 'jira_auth_token', type: 'text', nullable: true })
  jiraAuthToken: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
