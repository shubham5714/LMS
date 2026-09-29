"use client";

import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { FormEvent, Fragment, useState } from "react";
import { Card, Col, Form, Row } from "react-bootstrap";

interface BasicProps { }

const Basic: React.FC<BasicProps> = () => {
    const [passwordVisibility, setPasswordVisibility] = useState<{ [key: string]: boolean }>({
        password: false,
        newPassword: false,
        confirmPassword: false,
    });

    const togglePasswordVisibility = (field: string) => {
        setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const [passwords, setPasswords] = useState<{ [key: string]: string }>({
        password: "",
        newPassword: "",
        confirmPassword: "",
    });

    const updatePassword = (field: string, value: string) => {
        setPasswords((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const [errors, setErrors] = useState<{ password?: string; newPassword?: string; confirmPassword?: string }>({});

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        updatePassword("password", val);
        if (val.length >= 8) {
            setErrors((prev) => ({ ...prev, password: undefined }));
        }
    };

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        updatePassword("newPassword", val);
        if (val.length >= 8) {
            setErrors((prev) => ({ ...prev, newPassword: undefined }));
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        updatePassword("confirmPassword", val);
        if (val.length >= 8) {
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
        }
    };

    const validate = (): boolean => {
        const errs: { password?: string; newPassword?: string; confirmPassword?: string } = {};

        if (!passwords.password) {
            errs.password = "Password is required";
        } else if (passwords.password.length < 8) {
            errs.password = "Password must be at least 8 characters";
        }

        if (!passwords.newPassword) {
            errs.newPassword = "New Password is required";
        } else if (passwords.newPassword.length < 8) {
            errs.newPassword = "New Password must be at least 8 characters";
        } else if (passwords.newPassword === passwords.password) {
            errs.newPassword = "New Password must be different from the current password";
        }

        if (!passwords.confirmPassword) {
            errs.confirmPassword = "Confirm Password is required";
        } else if (passwords.confirmPassword !== passwords.newPassword) {
            errs.confirmPassword = "Passwords do not match";
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const router = useRouter();

    const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (validate()) {
            router.push("/signin");
        }
    };

    return (
        <Fragment>
            <div className="container-lg">
                <Row className="justify-content-center align-items-center authentication authentication-basic h-100">
                    <Col xxl={4} xl={5} lg={5} md={6} sm={8} className="col-12">
                        <Card className="custom-card my-4">
                            <Card.Body className="p-5">
                                <div className="mb-4 d-flex justify-content-center">
                                    <Link scroll={false} href="/dashboards/sales/">
                                        <Image fill src="../../../assets/images/brand-logos/desktop-logo.png" alt="logo" className="desktop-logo" />
                                        <Image fill src="../../../assets/images/brand-logos/desktop-white.png" alt="logo" className="desktop-white" />
                                    </Link>
                                </div>
                                <p className="h5 mb-2 text-center">Reset Password</p>
                                <p className="text-muted mb-4 text-center">Let's get started</p>
                                <Form onSubmit={handleSubmit}>
                                    <Row className="gy-3">
                                        <Col xl={12}>
                                            <label htmlFor="reset-password" className="form-label text-default">
                                                Current Password
                                            </label>
                                            <div className="position-relative">
                                                <Form.Control type={passwordVisibility.password ? "text" : "password"} autoComplete="off" className="form-control-lg" id="reset-password" placeholder="current password" value={passwords.password} onChange={handlePasswordChange} />
                                                <button type="button" className="show-password-button text-muted" onClick={() => togglePasswordVisibility("password")} aria-label="Toggle password visibility" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 0, cursor: "pointer", }}>
                                                    <i className={`${passwordVisibility.password ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}></i>
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-danger mt-1">{errors.password}</p>}
                                        </Col>

                                        <Col xl={12}>
                                            <label htmlFor="reset-newpassword" className="form-label text-default">
                                                New Password
                                            </label>
                                            <div className="position-relative">
                                                <Form.Control type={passwordVisibility.newPassword ? "text" : "password"} autoComplete="off" className="form-control-lg" id="reset-newpassword" placeholder="new password" value={passwords.newPassword} onChange={handleNewPasswordChange} />
                                                <button type="button" className="show-password-button text-muted" onClick={() => togglePasswordVisibility("newPassword")} aria-label="Toggle new password visibility" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 0, cursor: "pointer", }}>
                                                    <i className={`${passwordVisibility.newPassword ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}></i>
                                                </button>
                                            </div>
                                            {errors.newPassword && <p className="text-danger mt-1">{errors.newPassword}</p>}
                                        </Col>

                                        <Col xl={12}>
                                            <label htmlFor="reset-confirmpassword" className="form-label text-default">
                                                Confirm Password
                                            </label>
                                            <div className="position-relative">
                                                <Form.Control type={passwordVisibility.confirmPassword ? "text" : "password"} autoComplete="off" className="form-control-lg" id="reset-confirmpassword" placeholder="confirm password" value={passwords.confirmPassword} onChange={handleConfirmPasswordChange} />
                                                <button type="button" className="show-password-button text-muted" onClick={() => togglePasswordVisibility("confirmPassword")} aria-label="Toggle confirm password visibility" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 0, cursor: "pointer", }}>
                                                    <i className={`${passwordVisibility.confirmPassword ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}></i>
                                                </button>
                                            </div>
                                            {errors.confirmPassword && <p className="text-danger mt-1">{errors.confirmPassword}</p>}

                                            <div className="mt-3">
                                                <div className="form-check mb-0">
                                                    <input className="form-check-input" type="checkbox" value="" id="defaultCheck1" />
                                                    <label className="form-check-label fw-normal fs-13" htmlFor="defaultCheck1">
                                                        Remember password ?
                                                    </label>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    <div className="d-grid mt-4">
                                        <SpkButton Buttontype="submit" Size="lg" Buttonvariant="primary" Customclass="btn">
                                            Create
                                        </SpkButton>
                                    </div>
                                </Form>
                                <div className="text-center">
                                    <p className="text-muted mt-3">
                                        Remembered your password?{" "}
                                        <Link scroll={false} href="/signin" className="text-primary fw-medium">
                                            Sign In
                                        </Link>
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Fragment>
    );
};

export default Basic;
