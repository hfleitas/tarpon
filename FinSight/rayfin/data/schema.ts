import { AmlCase } from './AmlCase.js';
import { CreditReview } from './CreditReview.js';
import { TreasuryAction } from './TreasuryAction.js';
import { DigitalInitiative } from './DigitalInitiative.js';

export type FinSightAppSchema = {
  AmlCase: AmlCase;
  CreditReview: CreditReview;
  TreasuryAction: TreasuryAction;
  DigitalInitiative: DigitalInitiative;
};

export const schema = [AmlCase, CreditReview, TreasuryAction, DigitalInitiative];
