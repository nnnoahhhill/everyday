import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <SignUp 
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border border-black",
            headerTitle: "text-black",
            headerSubtitle: "text-black",
            socialButtonsBlockButton: "border border-black text-black hover:bg-black hover:text-white",
            formButtonPrimary: "bg-black text-white hover:bg-gray-800",
            formFieldInput: "border border-black",
            footerActionLink: "text-black hover:underline",
          },
        }}
      />
    </div>
  );
}
