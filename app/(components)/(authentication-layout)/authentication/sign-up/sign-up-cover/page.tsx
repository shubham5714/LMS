"use client"
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { Fragment, useState } from "react";
import { Card, Col, Form, Row } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";

interface CoverProps { }

const Cover: React.FC<CoverProps> = () => {

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

    const { email, password, confirmpassword } = data;

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
            <Row className=" authentication authentication-cover-main mx-0">
                <Col xxl={8} xl={7} className="">
                    <Row className=" justify-content-center align-items-center h-100">
                        <Col xxl={5} xl={9} lg={6} md={6} sm={8} className=" col-12">
                            <Card className=" custom-card my-4 border">
                                <Card.Body className=" p-5">
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
                                        <p className="text-muted mt-3 mb-0">Already have an account? <Link scroll={false} href="/signin" className="text-primary fw-medium">Sign In</Link></p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
                <Col xxl={4} xl={5} lg={12} className=" d-xl-block d-none px-0">
                    <div className="authentication-cover overflow-hidden">
                        <div className="authentication-cover-logo">
                            <Link scroll={false} href="/dashboards/sales/">
                                <Image fill src="../../../assets/images/brand-logos/desktop-white.png" alt="" className="authentication-brand desktop-white" />
                            </Link>
                        </div>
                        <div className="aunthentication-cover-content d-flex align-items-center justify-content-center">
                            <div>
                                <Image fill src="../../../assets/images/media/media-73.png" alt="" />
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </Fragment>
    );
};

export default Cover;