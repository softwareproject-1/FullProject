"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PayrollPolicies } from "./PayrollPolicies";
import { PayTypes } from "./PayTypes";
import { TaxRules } from "./TaxRules";
import { TerminationBenefits } from "./TerminationBenefits";
import Allowances from "./allowances";
import InsuranceBrackets from "./insuranceBrackets";
import SigningBonus from "./signingBonus";
import CompanySettings from "./companyWideSettings"; // note the casing

import PayGrades from "./payGrades";
type TabType =
  | "policies"
  | "payGrades"
  | "payTypes"
  | "taxRules"
  | "terminationBenefits"
  | "insuranceBrackets"
  | "allowances"
  | "companyWideSettings"
  | "signingBonus";

function PayrollConfigurationContent() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabType) || "policies";

  const renderContent = () => {
    switch (activeTab) {
      case "policies":
        return <PayrollPolicies />;
      case "payGrades":
        return <PayGrades />;
      case "payTypes":
        return <PayTypes />;
      case "taxRules":
        return <TaxRules />;
      case "terminationBenefits":
        return <TerminationBenefits />;
    case "companyWideSettings": // <- new case
        return <CompanySettings />; 
      case "insuranceBrackets":
        return <InsuranceBrackets />;
      // case "allowances":
      //   return (
      //     <div>
      //       <h1 className="text-3xl font-bold text-slate-900 mb-2">
      //         Allowances
      //       </h1>
      //       <p className="text-slate-600 mb-6">
      //         Manage employee allowances and benefits.
      //       </p>
      //       <div className="bg-white rounded-lg shadow p-6">
      //         <p className="text-gray-500">Allowances content will go here.</p>
      //       </div>
      //     </div>
      //   );
      case "allowances":
        return <Allowances />;

      case "signingBonus":
        return <SigningBonus />;

      default:
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Payroll Configuration
            </h1>
            <p className="text-slate-600">
              Select a section from the sidebar to get started.
            </p>
          </div>
        );
    }
  };

  return <div className="p-8">{renderContent()}</div>;
}

export default function PayrollConfigurationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-600">Loading configuration...</div>}>
      <PayrollConfigurationContent />
    </Suspense>
  );
}