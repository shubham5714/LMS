"use client"
import SpkButton from "@/shared/@spk-reusable-components/reusable-uiElements/spk-buttons";
import SpkAlert from '@/shared/@spk-reusable-components/reusable-uiElements/spk-alerts';
import { supabase } from '@/shared/lib/supabase';
import { useUpdateMembership, type UserMembershipRow } from '@/shared/contextapi/MembershipContext';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { Fragment, useRef, useState, useEffect } from "react";
import { Card, Col, Form, Row } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';

interface BasicProps { }

const Basic: React.FC<BasicProps> = () => {
    const applyMembership = useUpdateMembership();
    const [inputValues, setInputValues] = useState({
        one: "",
        two: "",
        three: "",
        four: "",
        five: "",
        six: "",
    });
    const [codeError, setCodeError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const inputRefs = {
        one: useRef<HTMLInputElement | null>(null),
        two: useRef<HTMLInputElement | null>(null),
        three: useRef<HTMLInputElement | null>(null),
        four: useRef<HTMLInputElement | null>(null),
        five: useRef<HTMLInputElement | null>(null),
        six: useRef<HTMLInputElement | null>(null),
    };

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Check if user is already authenticated
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.push('/dashboards/sales');
            }
        };
        checkAuth();
    }, [router, supabase.auth]);

    const handleChange = (
        field: keyof typeof inputValues,
        nextInputRef: React.RefObject<HTMLInputElement | null>,
        value: string
    ) => {
        if (/^[0-9]?$/.test(value)) { // Only allow 1 digit or empty
            setInputValues((prev) => ({ ...prev, [field]: value }));
            setCodeError(null);

            if (value && nextInputRef.current) {
                nextInputRef.current.focus();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const codeComplete = Object.values(inputValues).every((val) => val !== '');

        if (!codeComplete) {
            setCodeError('Please enter the complete 6-digit code.');
            return;
        }

        setIsLoading(true);
        setCodeError(null);

        try {
            const otpCode = Object.values(inputValues).join('');
            
            // Get stored credentials from session storage
            const email = sessionStorage.getItem('mfa_email');
            const password = sessionStorage.getItem('mfa_password');
            const mfaTicket = sessionStorage.getItem('mfa_ticket');

            if (!email || !password) {
                throw new Error('Session expired. Please login again.');
            }

            // First, sign in with password to get MFA challenge
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
                email, 
                password 
            });

            if (signInError) {
                throw signInError;
            }

            let verifiedData: any = null;

            // Get MFA factors and create challenge
            const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError || !factors?.totp || factors.totp.length === 0) {
                throw new Error('No MFA factors found');
            }

            // Create MFA challenge
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: factors.totp[0].id
            });

            if (challengeError) {
                throw challengeError;
            }

            // Verify OTP with the challenge
            const { data: verified, error: otpError } = await supabase.auth.mfa.verify({
                factorId: factors.totp[0].id,
                code: otpCode,
                challengeId: challenge.id
            });

            if (otpError) {
                throw otpError;
            }
            verifiedData = verified;

            // MFA verification successful, load membership
            if (verifiedData) {
                const userId = verifiedData.user?.id;
                if (userId) {
                    const { data: memRow, error: memError } = await supabase
                        .from('user_memberships')
                        .select('id, user_id, username, membership, created_at')
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (memError) {
                        throw memError;
                    }
                    if (!memRow) {
                        throw new Error('No membership record found for this account.');
                    }

                    if (mounted) {
                        applyMembership(memRow as UserMembershipRow);
                    }
                }

                // Clear session storage
                sessionStorage.removeItem('mfa_email');
                sessionStorage.removeItem('mfa_password');
                sessionStorage.removeItem('mfa_ticket');

                toast.success('Login successful', {
                    position: 'top-right',
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });

                setTimeout(() => {
                    router.push('/dashboards/sales');
                }, 1200);
            } else {
                throw new Error('MFA verification failed');
            }
        } catch (err: any) {
            const msg = err.message || 'Verification failed';
            setCodeError(msg);
            toast.error(msg, {
                position: 'top-right',
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="container-lg">
                <Row className=" justify-content-center align-items-center authentication two-step-verification authentication-basic h-100">
                    <Col xxl={4} xl={5} lg={5} md={6} sm={8} className="col-12">
                        <Card className=" custom-card my-4">
                            <Card.Body className=" p-5">
                                <div className="mb-4 d-flex justify-content-center">
                                    <Link scroll={false} href="/dashboards/sales/">
                                        <Image fill src="../../../assets/images/brand-logos/desktop-logo.png" alt="logo" className="desktop-logo" />
                                        <Image fill src="../../../assets/images/brand-logos/desktop-white.png" alt="logo" className="desktop-white" />
                                    </Link>
                                </div>
                                <p className="h5 mb-2 text-center">Two-Factor Authentication</p>
                                <p className="mb-4 text-muted op-7 fw-normal text-center fs-12">Enter the 6-digit code from your authenticator app.</p>
                                {codeError && <SpkAlert variant="danger" className="mb-3">{codeError}</SpkAlert>}
                                <Form onSubmit={handleSubmit}>
                                    <Row className=" gy-3">
                                        <Col xl={12} className=" mb-2">
                                            <Row className=" gx-2">
                                                <div className="col-2">
                                                    <Form.Control type="text" className="text-center" id="one"
                                                        value={inputValues.one}
                                                        onChange={(e) => handleChange('one', inputRefs.two, e.target.value)}
                                                        maxLength={1}
                                                        ref={inputRefs.one} />
                                                </div>
                                                <div className="col-2">
                                                    <Form.Control type="text" className="text-center" id="two" value={inputValues.two}
                                                        onChange={(e) => handleChange('two', inputRefs.three, e.target.value)}
                                                        maxLength={1}
                                                        ref={inputRefs.two} />
                                                </div>
                                                <div className="col-2">
                                                    <Form.Control type="text" className="text-center" id="three" value={inputValues.three}
                                                        onChange={(e) => handleChange('three', inputRefs.four, e.target.value)}
                                                        maxLength={1}
                                                        ref={inputRefs.three} />
                                                </div>
                                                <div className="col-2">
                                                    <Form.Control type="text" className="text-center" id="four" value={inputValues.four}
                                                        onChange={(e) => handleChange('four', inputRefs.five, e.target.value)}
                                                        maxLength={1}
                                                        ref={inputRefs.four} />
                                                </div>
                                                <div className="col-2">
                                                    <Form.Control type="text" className="text-center" id="five" value={inputValues.five}
                                                        onChange={(e) => handleChange('five', inputRefs.six, e.target.value)}
                                                        maxLength={1}
                                                        ref={inputRefs.five} />
                                                </div>
                                                <div className="col-2">
                                                    <Form.Control type="text" className="text-center" id="six" value={inputValues.six}
                                                        onChange={(e) => handleChange('six', inputRefs.one, e.target.value)}
                                                        maxLength={1}
                                                        ref={inputRefs.six} />
                                                </div>
                                            </Row>
                                        </Col>
                                        <Col xl={12} className=" d-grid mt-2">
                                            <SpkButton 
                                                Buttonvariant="primary" 
                                                Buttontype="submit" 
                                                Customclass="btn"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Verifying...' : 'Verify'}
                                            </SpkButton>
                                            <div className="text-center">
                                                <p className="text-muted mt-3 mb-0">
                                                    <Link scroll={false} href="/" className="text-primary fw-medium">Back to Login</Link>
                                                </p>
                                            </div>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Fragment>
    );
};

export default Basic;