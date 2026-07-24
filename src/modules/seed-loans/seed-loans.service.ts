import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';
import { paginate } from '../../types';
import { IssueLoanInput } from './seed-loans.schema';

const LOAN_INCLUDE = {
  farmer: { select: { id: true, farmerId: true, firstName: true, lastName: true, phone: true } },
  commodity: { select: { id: true, name: true, code: true } },
} as const;

export async function listLoans(params: {
  page?: number; limit?: number; farmerId?: number; status?: string;
}) {
  const { skip, take, page, limit } = paginate(params.page, params.limit);
  const where = {
    ...(params.farmerId ? { farmerId: params.farmerId } : {}),
    ...(params.status ? { status: params.status as never } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.seedLoan.count({ where }),
    prisma.seedLoan.findMany({ where, include: LOAN_INCLUDE, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getLoanById(id: number) {
  const loan = await prisma.seedLoan.findUnique({ where: { id }, include: LOAN_INCLUDE });
  if (!loan) throw Object.assign(new Error('Loan not found'), { status: 404 });
  return loan;
}

export async function issueLoan(input: IssueLoanInput) {
  const farmer = await prisma.farmer.findUnique({ where: { id: input.farmerId } });
  if (!farmer) throw Object.assign(new Error('Farmer not found'), { status: 404 });

  return prisma.seedLoan.create({
    data: {
      farmerId: input.farmerId,
      commodityId: input.commodityId,
      loanAmount: input.loanAmount,
      loanBalance: input.loanAmount,
      issueDate: new Date(input.issueDate),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes,
    },
    include: LOAN_INCLUDE,
  });
}

export async function recordPayment(id: number, amount: number) {
  const loan = await getLoanById(id);
  if (loan.status !== 'active') throw Object.assign(new Error('Loan is not active'), { status: 400 });

  const newBalance = new Decimal(loan.loanBalance).sub(amount);
  if (newBalance.lt(0)) throw Object.assign(new Error('Payment exceeds outstanding balance'), { status: 400 });

  return prisma.seedLoan.update({
    where: { id },
    data: {
      loanBalance: newBalance,
      status: newBalance.lte(0.01) ? 'paid' : 'active',
    },
    include: LOAN_INCLUDE,
  });
}

export async function markDefaulted(id: number) {
  await getLoanById(id);
  return prisma.seedLoan.update({ where: { id }, data: { status: 'defaulted' }, include: LOAN_INCLUDE });
}
