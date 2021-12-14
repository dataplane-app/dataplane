import React, { useEffect, useState } from "react";
import { InputAdornment, TextField } from "@mui/material";
import "./passwordField.css";
import { passwordStrength } from "check-password-strength";

const PasswordReturn = (score) => {
  switch (score) {
    case "Too weak":
      return [1, "weak"];
    case "Weak":
      return [2, "weak"];
    case "Medium":
      return [3, "medium"];
    case "Strong":
      return [4, "strong"];
    default:
      return [1, "weak"];
  }
};

const PasswordField = (props) => {
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  /* https://github.com/mui-org/material-ui/pull/21984 */
  useEffect(() => {
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = "";
    };
  }, []);

  const minStrength = 3;
  const thresholdLength = 6;
  const passwordLength = password.length;
  const isPasswordStrong = strength >= minStrength;
  const isPasswordLong = passwordLength > thresholdLength;

  console.log(strength);

  const strengthClass = ["strength-meter mt-2", passwordLength > 0 ? "visible" : "invisible"].join(" ").trim();
  const counterClass = ["badge badge-pill", isPasswordLong ? (isPasswordStrong ? "badge-success" : "badge-warning") : "badge-danger"]
    .join(" ")
    .trim();
  return (
    <div className="position-relative">
      <TextField
        type="password"
        valid={isPasswordLong}
        {...props}
        onChange={(e) => {
          const newPassword = e.target.value;
          console.log("password strength", PasswordReturn(passwordStrength(newPassword).value));
          setPassword(newPassword);
          setStrength(PasswordReturn(passwordStrength(newPassword).value)[0]);
        }}
        onFocus={(e) => {
          setShowInfo(true);
        }}
        onBlur={() => {
          if (passwordLength === 0) {
            setShowInfo(false);
          }
        }}
      />

      {showInfo ? (
        <div>
          <div className="password-message">
            {!isPasswordLong && <div className="password-red"> Password strength</div>}
            {isPasswordLong && !isPasswordStrong && <div className="password-orange"> Password strength</div>}
            {isPasswordLong && isPasswordStrong && <div className="password-green"> Password strength</div>}
          </div>
          <div className={strengthClass}>
            <div className="strength-meter-fill" data-strength={strength}></div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PasswordField;