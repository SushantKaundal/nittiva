import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CredentialResponse } from "@react-oauth/google";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthPageLayout } from "@/components/layout/AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import { LoginCredentials } from "@/lib/api";
import { getRedirectRoute, getRoleDescription } from "@/lib/roleNavigation";

export default function Login() {
  const navigate = useNavigate();
  const { login, socialLogin, isLoading } = useAuth();
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const handleLogin = async (data: LoginCredentials) => {
    const result = await login(data);
    if (result.success && result.user) {
      // Get role-based redirect route
      const redirectRoute = getRedirectRoute(result.user.role);
      const roleDescription = getRoleDescription(result.user.role);

      console.log(
        `🎯 Redirecting ${result.user.role || "member"} to ${redirectRoute}: ${roleDescription}`,
      );
      navigate(redirectRoute);
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
      <div className="relative w-full max-w-md">
        <AuthForm
          type="login"
          onSubmit={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
          isSocialLoading={isSocialLoading}
        />
      </div>
    </AuthPageLayout>
  );
}
