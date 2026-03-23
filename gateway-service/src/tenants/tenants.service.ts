import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantInput } from './dto/create-tenant.input';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantsRepository.find();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async create(createTenantInput: CreateTenantInput): Promise<Tenant> {
    const tenant = this.tenantsRepository.create(createTenantInput);
    return this.tenantsRepository.save(tenant);
  }

  async remove(id: string): Promise<boolean> {
    const tenant = await this.findOne(id);
    await this.tenantsRepository.remove(tenant);
    return true;
  }
}
