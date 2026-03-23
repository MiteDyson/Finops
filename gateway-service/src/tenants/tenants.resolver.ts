import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TenantsService } from './tenants.service';
import { TenantType } from './tenant.type';
import { CreateTenantInput } from './dto/create-tenant.input';

@Resolver(() => TenantType)
export class TenantsResolver {
  constructor(private readonly tenantsService: TenantsService) {}

  // Query: Get all tenants
  @Query(() => [TenantType], { name: 'tenants' })
  findAll(): Promise<TenantType[]> {
    return this.tenantsService.findAll();
  }

  // Query: Get a single tenant by ID
  @Query(() => TenantType, { name: 'tenant' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<TenantType> {
    return this.tenantsService.findOne(id);
  }

  // Mutation: Create a new tenant
  @Mutation(() => TenantType)
  createTenant(
    @Args('createTenantInput') createTenantInput: CreateTenantInput,
  ): Promise<TenantType> {
    return this.tenantsService.create(createTenantInput);
  }

  // Mutation: Delete a tenant
  @Mutation(() => Boolean)
  removeTenant(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.tenantsService.remove(id);
  }
}
