import { AuthForm } from "@/components/auth/AuthForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <main className="flex h-screen w-full items-center justify-center bg-neutral-900 p-4">
        <Card className="w-full max-w-md bg-white">
          <CardHeader>
            <CardTitle className="text-primary">Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa a tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm />
          </CardContent>
        </Card>
      </main>
    </main>
  );
}
