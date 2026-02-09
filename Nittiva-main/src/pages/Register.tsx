import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CredentialResponse } from "@react-oauth/google";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthPageLayout } from "@/components/layout/AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import { RegisterCredentials } from "@/lib/api";
import { getRedirectRoute, getRoleDescription } from "@/lib/roleNavigation";

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, socialLogin, isLoading } = useAuth();
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const handleRegister = async (data: RegisterCredentials) => {
    const success = await registerUser(data);
    if (success) {
      // Check if user is now authenticated (meaning registration included login)
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      if (currentUser && localStorage.getItem("auth_token")) {
        // User was automatically logged in after registration
        const redirectRoute = getRedirectRoute(currentUser.role);
        const roleDescription = getRoleDescription(currentUser.role);

        console.log(
          `🎯 Registration successful, redirecting ${currentUser.role || "member"} to ${redirectRoute}: ${roleDescription}`,
        );
        navigate(redirectRoute);
      } else {
        // Traditional flow - redirect to email verification
        localStorage.setItem("pending_verification_email", data.email);
        navigate("/email-verification");
      }
    }
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setIsSocialLoading(true);
    try {
      if (!credentialResponse.credential) {
        console.error("No credential received from Google");
        return;
      }

      const result = await socialLogin({
        provider: "google",
        token: credentialResponse.credential,
      });

      if (result.success && result.user) {
        // Get role-based redirect route
        const redirectRoute = getRedirectRoute(result.user.role);
        const roleDescription = getRoleDescription(result.user.role);

        console.log(
          `🎯 Redirecting ${result.user.role || "member"} to ${redirectRoute}: ${roleDescription}`,
        );
        navigate(redirectRoute);
      }
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <AuthPageLayout showAuthLinks={false}>
      <div className="w-full max-w-md">
        <AuthForm
          type="register"
          onSubmit={handleRegister}
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
          isSocialLoading={isSocialLoading}
        />
      </div>
    </AuthPageLayout>
  );
}
