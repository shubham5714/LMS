"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { Fragment, useState } from "react";
import { Card, Col, Form, Row } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";

interface BasicProps { }

const Basic: React.FC<BasicProps> = () => {
    const router = useRouter();

    const [passwordVisibility, setPasswordVisibility] = useState({
        password: false,
        confirmPassword: false,
    });

    const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
        setPasswordVisibility((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const [data, setData] = useState({
        email: "adminnext@gmail.com",
        password: "1234567890",
        confirmpassword: "1234567890",
    });

    const {  email, password, confirmpassword } = data;

    const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmpassword) {
            toast.error("Passwords do not match!");
            return;
        }

        // Example validation — you can replace with real signup logic
        if (email === "adminnext@gmail.com" && password === "1234567890") {
            toast.success("Created Successfully!");
            router.push("/signin");
        } else {
            toast.error("Invalid email or password");
        }
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="container-lg">
                <Row className="justify-content-center align-items-center authentication authentication-basic h-100">
                    <Col xxl={4} xl={5} lg={5} md={7} sm={9} className="col-12">
                        <Card className="custom-card my-4">
                            <Card.Body className="card-body p-5">
                                <div className="mb-4 d-flex justify-content-center">
                                    <Link scroll={false} href="/dashboards/sales/">
                                        <Image src="../../../assets/images/brand-logos/desktop-logo.png" alt="logo" fill className="desktop-logo" style={{ objectFit: "contain" }} />
                                    </Link>
                                </div>
                                <p className="h5 mb-2 text-center">Sign Up</p>
                                <p className="text-muted mb-4 text-center">Let's get started</p>
                                <Form onSubmit={handleSubmit}>
                                    <Link scroll={false} href="#!" className="other-links d-flex align-items-center gap-2 justify-content-center flex-fill mb-3">
                                        <span className="fs-13 text-default fw-medium">Signup with Google</span>
                                        <span className="avatar avatar-xs custom-width" style={{ position: "relative", width: 20, height: 20 }}>
                                            <Image src="../../../assets/images/media/apps/google.png" alt="Google" fill style={{ objectFit: "contain" }} />
                                        </span>
                                    </Link>
                                    <Link scroll={false} href="#!" className="other-links d-flex align-items-center gap-2 justify-content-center flex-fill">
                                        <span className="fs-13 text-default fw-medium">Signup with Facebook</span>
                                        <span className="avatar avatar-xs custom-width" style={{ position: "relative", width: 20, height: 20 }}>
                                            <Image src="../../../assets/images/media/apps/facebook.png" alt="Facebook" fill style={{ objectFit: "contain" }} />
                                        </span>
                                    </Link>
                                    <div className="text-center my-3 authentication-barrier">
                                        <span className="fs-16">or</span>
                                    </div>
                                    <Row className="gy-3">
                                        <Col xl={12}>
                                            <Form.Label htmlFor="signup-email" className="form-label text-default">
                                                Full Name
                                            </Form.Label>
                                            <Form.Control type="email" id="signup-email" name="email" placeholder="Email" value={email} onChange={changeHandler} />
                                        </Col>
                                        <Col xl={12}>
                                            <Form.Label htmlFor="signup-password" className="form-label text-default">
                                                Password
                                            </Form.Label>
                                            <div className="position-relative">
                                                <Form.Control className="form-control create-password-input" id="signup-password" name="password" placeholder="Password" type={passwordVisibility.password ? "text" : "password"} value={password} onChange={changeHandler} />
                                                <button type="button" onClick={() => togglePasswordVisibility("password")} className="show-password-button text-muted" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none" }} aria-label="Toggle password visibility" >
                                                    <i className={`ri-${passwordVisibility.password ? "eye-line" : "eye-off-line"}`}></i>
                                                </button>
                                            </div>
                                        </Col>
                                        <Col xl={12}>
                                            <Form.Label htmlFor="signup-confirmpassword" className="form-label text-default">
                                                Confirm Password
                                            </Form.Label>
                                            <div className="position-relative">
                                                <Form.Control type={passwordVisibility.confirmPassword ? "text" : "password"} className="form-control create-password-input" id="signup-confirmpassword" name="confirmpassword" placeholder="Confirm password" value={confirmpassword} onChange={changeHandler} />
                                                <button type="button" onClick={() => togglePasswordVisibility("confirmPassword")} className="show-password-button text-muted" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none" }} aria-label="Toggle confirm password visibility" >
                                                    <i className={`ri-${passwordVisibility.confirmPassword ? "eye-line" : "eye-off-line"}`}></i>
                                                </button>
                                            </div>
                                        </Col>
                                    </Row>
                                    <div className="d-grid mt-4">
                                        <button type="submit" className="btn btn-primary">
                                            Sign Up
                                        </button>
                                    </div>
                                </Form>
                                <div className="text-center">
                                    <p className="text-muted mt-3">
                                        Already have an account?{" "}
                                        <Link href="/signin" className="text-primary">
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