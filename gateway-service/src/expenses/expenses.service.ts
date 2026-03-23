import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseInput } from './dto/create-expense.input';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
  ) {}

  // Get all expenses for a specific tenant (multi-tenant isolation)
  async findExpensesByTenant(tenantId: string): Promise<Expense[]> {
    return this.expensesRepository.find({
      where: { tenantId },
      order: { recordedAt: 'DESC' },
    });
  }

  // Get a single expense record
  async findOne(id: string): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  // Create a new expense (called internally when ingestion service pushes data)
  async create(createExpenseInput: CreateExpenseInput): Promise<Expense> {
    const expense = this.expensesRepository.create(createExpenseInput);
    return this.expensesRepository.save(expense);
  }

  // Get total spending per service for a tenant (for dashboard charts)
  async getSpendingByService(tenantId: string): Promise<{ serviceName: string; total: number }[]> {
    const result = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('expense.serviceName', 'serviceName')
      .addSelect('SUM(expense.cost)', 'total')
      .where('expense.tenantId = :tenantId', { tenantId })
      .groupBy('expense.serviceName')
      .orderBy('total', 'DESC')
      .getRawMany();

    return result;
  }

  // Get expenses from the last N days (used by Django anomaly engine baseline)
  async getRecentExpenses(tenantId: string, days: number): Promise<Expense[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.expensesRepository
      .createQueryBuilder('expense')
      .where('expense.tenantId = :tenantId', { tenantId })
      .andWhere('expense.recordedAt >= :since', { since })
      .orderBy('expense.recordedAt', 'ASC')
      .getMany();
  }
}
