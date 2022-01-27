import React, { useEffect } from 'react';
import './passwordField.css';
import { useState } from '@hookstate/core';
import { passwordStrength } from 'check-password-strength';
import { InputAdornment, TextField } from '@mui/material';

const PasswordReturn = (score) => {
    switch (score) {
        case 'Too weak':
            return [1, 'weak'];
        case 'Weak':
            return [2, 'weak'];
        case 'Medium':
            return [3, 'medium'];
        case 'Strong':
            return [4, 'strong'];
        default:
            return [1, 'weak'];
    }
};

const PasswordField = (props) => {
    const password = useState('');
    const strength = useState(0);
    const showInfo = useState(false);

    /* https://github.com/mui-org/material-ui/pull/21984 */
    useEffect(() => {
        document.body.style.overflowX = 'hidden';
        return () => {
            document.body.style.overflowX = '';
        };
    }, []);

    const minStrength = 3;
    const thresholdLength = 6;
    const passwordLength = password.get().length;
    const isPasswordStrong = strength.get() >= minStrength;
    const isPasswordLong = passwordLength > thresholdLength;

    console.log(strength.get());

    const strengthClass = [`${props.theme === 'light' ? 'strength-meter' : 'strength-meter-dark'} mt-2`, passwordLength > 0 ? 'visible' : 'invisible'].join(' ').trim();
    const counterClass = ['badge badge-pill', isPasswordLong ? (isPasswordStrong ? 'badge-success' : 'badge-warning') : 'badge-danger'].join(' ').trim();
    return (
        <div className="position-relative">
            <TextField
                type="password"
                valid={isPasswordLong.toString()}
                {...props}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            {password.get() !== '' && <span className={counterClass}>{PasswordReturn(passwordStrength(password.get()).value)[1]}</span>}
                        </InputAdornment>
                    ),
                }}
                ref={props.register.ref}
                onChange={(e) => {
                    props.register.onChange(e);
                    const newPassword = e.target.value;
                    console.log('password strength', PasswordReturn(passwordStrength(newPassword).value));
                    password.set(newPassword);
                    strength.set(PasswordReturn(passwordStrength(newPassword).value)[0]);
                }}
                onFocus={(e) => {
                    showInfo.set(true);
                }}
                onBlur={() => {
                    if (passwordLength === 0) {
                        showInfo.set(false);
                        strength.set(0);
                    }
                }}
            />

            {showInfo.get() ? (
                <div>
                    <div className="password-message">
                        {!isPasswordLong && <div className="password-red"> Password strength</div>}
                        {isPasswordLong && !isPasswordStrong && <div className="password-orange"> Password strength</div>}
                        {isPasswordLong && isPasswordStrong && <div className="password-green"> Password strength</div>}
                    </div>
                    <div className={strengthClass}>
                        <div className="strength-meter-fill" data-strength={strength.get()}></div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default PasswordField;
