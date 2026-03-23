import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class ExpenseType {
  @Field(() => ID)
  id: string;

  @Field()
  tenantId: string;

  @Field()
  provider: string;

  @Field()
  serviceName: string;

  @Field(() => Float)
  cost: number;

  @Field()
  recordedAt: Date;
}
