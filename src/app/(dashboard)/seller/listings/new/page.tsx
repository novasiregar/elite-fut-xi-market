'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createListingAction } from '@/actions/listing.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="gold-gradient text-black font-bold" disabled={pending}>
      {pending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : 'Create Listing'}
    </Button>
  );
}

export default function NewListingPage() {
  const [state, action] = useActionState(createListingAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state.data) {
      router.push(`/seller/listings`);
    }
  }, [state, router]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Create New Listing</h1>
        <p className="text-muted-foreground text-sm">Fill in the details of the account you want to sell</p>
      </div>

      {state?.success === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={action} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-xs text-muted-foreground">(10-100 chars)</span></Label>
              <Input id="title" name="title" placeholder="FC 25 PC Ultimate Team — 92 Rated Squad..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={5}
                placeholder="Describe the account in detail — squad, players, coins, history..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (IDR)</Label>
                <Input id="price" name="price" type="number" min="10000" placeholder="500000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coins">Coins (optional)</Label>
                <Input id="coins" name="coins" type="number" placeholder="1000000" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select name="platform" required>
                  <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="PLAYSTATION">PlayStation</SelectItem>
                    <SelectItem value="XBOX">Xbox</SelectItem>
                    <SelectItem value="MOBILE">Mobile</SelectItem>
                    <SelectItem value="NINTENDO">Nintendo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transfer Method</Label>
                <Select name="transferMethod" required>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_ACCESS">Full Access</SelectItem>
                    <SelectItem value="EMAIL_CHANGE">Email Change</SelectItem>
                    <SelectItem value="MIDMAN">Middleman</SelectItem>
                    <SelectItem value="GIFT">Gift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (OVR)</Label>
                <Input id="rating" name="rating" type="number" min="0" max="99" placeholder="88" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountLevel">Account Level</Label>
                <Input id="accountLevel" name="accountLevel" type="number" placeholder="100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags <span className="text-xs text-muted-foreground">(comma separated)</span></Label>
              <Input id="tags" name="tags" placeholder="full squad, r9, mbappe, rare players" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <SubmitButton />
          <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
