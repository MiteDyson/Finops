import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ExpensesService } from './expenses.service';
import { ExpenseType } from './expense.type';
import { CreateExpenseInput } from './dto/create-expense.input';

@Resolver(() => ExpenseType)
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}

  // Query: Get all expenses for a tenant (the main dashboard query)
  @Query(() => [ExpenseType], { name: 'getTenantExpenses' })
  getTenantExpenses(
    @Args('tenantId', { type: () => ID }) tenantId: string,
  ): Promise<ExpenseType[]> {
    return this.expensesService.findExpensesByTenant(tenantId);
  }

  // Query: Get a single expense by ID
  @Query(() => ExpenseType, { name: 'expense' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<ExpenseType> {
    return this.expensesService.findOne(id);
  }

  // Mutation: Manually log an expense (for testing; ingestion-service does this automatically)
  @Mutation(() => ExpenseType)
  createExpense(
    @Args('createExpenseInput') createExpenseInput: CreateExpenseInput,
  ): Promise<ExpenseType> {
    return this.expensesService.create(createExpenseInput);
  }
}
