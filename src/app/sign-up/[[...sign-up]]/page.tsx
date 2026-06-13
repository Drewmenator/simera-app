import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* forceRedirectUrl sends new users through the onboarding wizard */}
      <SignUp forceRedirectUrl="/onboarding" />
    </div>
  );
}
