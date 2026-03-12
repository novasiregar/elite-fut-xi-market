import { adminService } from '@/modules/admin/admin.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { reviewKycAction } from '@/actions/admin.actions';
import Image from 'next/image';
import { FileCheck, User } from 'lucide-react';

export const metadata = { title: 'KYC Verifications' };

export default async function VerificationsPage() {
  const { items } = await adminService.getPendingKyc(1, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC Verifications</h1>
        <p className="text-muted-foreground text-sm">{items.length} pending reviews</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No pending KYC submissions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((kyc) => (
            <Card key={kyc.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{kyc.user.username}</p>
                      <p className="text-sm text-muted-foreground">{kyc.user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(kyc.submittedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={kyc.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Identity Document</p>
                    <a href={kyc.identityDocument} target="_blank" rel="noreferrer">
                      <div className="relative h-32 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
                        <Image src={kyc.identityDocument} alt="ID" fill className="object-cover" />
                      </div>
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Selfie Photo</p>
                    <a href={kyc.selfiePhoto} target="_blank" rel="noreferrer">
                      <div className="relative h-32 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
                        <Image src={kyc.selfiePhoto} alt="Selfie" fill className="object-cover" />
                      </div>
                    </a>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">ID Number</p>
                  <p className="text-sm font-mono font-semibold">{kyc.identityNumber}</p>
                  {kyc.bankName && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Bank: {kyc.bankName} · {kyc.bankAccountNumber} · {kyc.bankAccountName}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <form action={reviewKycAction.bind(null, null)}>
                    <input type="hidden" name="kycId"  value={kyc.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <Button type="submit" className="gold-gradient text-black font-semibold">Approve</Button>
                  </form>
                  <form action={reviewKycAction.bind(null, null)}>
                    <input type="hidden" name="kycId"  value={kyc.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <input type="hidden" name="note"   value="Documents do not meet requirements" />
                    <Button type="submit" variant="destructive">Reject</Button>
                  </form>
                  <form action={reviewKycAction.bind(null, null)}>
                    <input type="hidden" name="kycId"  value={kyc.id} />
                    <input type="hidden" name="status" value="RESUBMIT" />
                    <Button type="submit" variant="outline">Request Resubmit</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
