import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 shadow-sm">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              404 Tidak Ditemukan
            </h1>
            <p className="text-sm text-muted-foreground">
              Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
            </p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/">Kembali ke Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
