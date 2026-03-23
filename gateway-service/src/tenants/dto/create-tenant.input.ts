import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateTenantInput {
  @Field()
  companyName: string;

  @Field({ nullable: true })
  jiraDomain?: string;

  @Field({ nullable: true })
  jiraAuthToken?: string;
}
