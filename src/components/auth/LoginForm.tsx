import React from "react";
import FormCard from "../form/FormCard";
import { useTranslations } from "next-intl";
function LoginForm() {
  const tForm = useTranslations("Form");

  return (
    <div>
      <FormCard
        title={tForm("loginTitle")}
        subtitle={tForm("loginSubTitle")}
      ></FormCard>
    </div>
  );
}

export default LoginForm;
