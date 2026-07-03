import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <div className="flex min-h-svh w-full flex-1 items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
