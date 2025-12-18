"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/utils/ApiClient";

interface RegisterCandidateData {
  firstName: string;
  middleName?: string;
  lastName: string;
  nationalId: string;
  password: string;
  confirmPassword: string;
  personalEmail?: string;
  mobilePhone?: string;
  dateOfBirth?: string;
}

export default function RegisterCandidatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterCandidateData>({
    firstName: "",
    lastName: "",
    nationalId: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof RegisterCandidateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (!formData.firstName) {
      setMessage("First Name is required");
      return;
    }
    if (!formData.lastName) {
      setMessage("Last Name is required");
      return;
    }
    if (!formData.nationalId) {
      setMessage("National ID is required");
      return;
    }
    if (formData.nationalId.length < 6) {
      setMessage("National ID must be at least 6 characters");
      return;
    }
    if (!formData.password) {
      setMessage("Password is required");
      return;
    }
    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      console.log("Registering candidate with data:", registerData);
      const response = await axiosInstance.post("/auth/register-candidate", registerData);
      console.log("Registration response:", response.data);
      
      // Handle response structure: response.data.data.access_token or response.data.access_token
      const accessToken = response.data?.data?.access_token || response.data?.access_token;
      
      if (accessToken) {
        // Store token
        if (typeof window !== "undefined") {
          localStorage.setItem("token", accessToken);
        }
        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setMessage("Registration successful! Please login.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMsg = "Registration failed. Please try again.";
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      } else if (error.response?.status === 409) {
        errorMsg = "This National ID or Email is already registered. Please use different credentials.";
      }
      
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 relative">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      <Card className="max-w-md w-full relative z-10 shadow-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-center text-slate-900">Register as Candidate</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <p className="text-slate-600 text-sm">
                Create your candidate account to apply for positions. All fields marked with * are required.
              </p>
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter your first name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                name="middleName"
                type="text"
                value={formData.middleName || ""}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
                placeholder="Enter your middle name (optional)"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter your last name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="nationalId">National ID *</Label>
              <Input
                id="nationalId"
                name="nationalId"
                type="text"
                value={formData.nationalId}
                onChange={(e) => handleInputChange("nationalId", e.target.value)}
                placeholder="Enter your national ID (min 6 characters)"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="personalEmail">Personal Email</Label>
              <Input
                id="personalEmail"
                name="personalEmail"
                type="email"
                value={formData.personalEmail || ""}
                onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                placeholder="Enter your email (optional)"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="mobilePhone">Mobile Phone</Label>
              <Input
                id="mobilePhone"
                name="mobilePhone"
                type="tel"
                value={formData.mobilePhone || ""}
                onChange={(e) => handleInputChange("mobilePhone", e.target.value)}
                placeholder="Enter your mobile phone (optional)"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ""}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Registering..." : "Register as Candidate"}
            </Button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="text-blue-600 hover:text-blue-700 text-sm underline"
                disabled={isLoading}
              >
                Already have an account? Login here
              </button>
            </div>

            {message && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm ${
                  message.includes("success") || message.includes("successful")
                    ? "bg-green-500/20 text-green-600 border border-green-500/30"
                    : "bg-red-500/20 text-red-600 border border-red-500/30"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
