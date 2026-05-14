"use client";

import Link from "next/link";
import Logo from "../components/logo";

import { useState } from "react";

export const POLICY_AND_COMPLIANCE ={
    title: "POLICY AND COMPLIANCE",
    content: "",
    subsections: [
        {title: "Subsection 1", 
         content: "Content for subsection 1"},

        {title: "Subsection 2",
         content: "Content for subsection 2"},

        {title: "Definition",
         list:[
            {bold: "Term 1", description: "Definition of term 1"},
            {bold: "Term 2", description: "Definition of term 2"},
         ]},
    ]
}

export default function PolicyCompliancePage() {
    return (
        <div style = {{background: '#ffffff', width: '100%'}}> 
            <header style={{ position: 'sticky', top: 0, zIndex: 50, padding: '16px', background: '#15c4c4', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Logo />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Flooring Solulu</h1>
                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>Just Solutions</p>
                    </div>
                </div>
            
            <nav style={{ marginTop: '10px' }}>
                            <Link href="/" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
                            <Link href="/products" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Products</Link>
                            <Link href="/compare" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500, borderBottom: '2px solid white' }}>Compare</Link>
                            <Link href="#" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>About Us</Link>
                            <Link href="#" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Vlogs</Link>
                        </nav>
            </header>

            <div style={{ width: '100%', marginBottom: '60px', background: '#ffffff', color: '#333' }}>
                <section style={{ width: '100%', background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Policy and Compliance</h1>
                    <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>Overview of our policy and compliance sections.</p>
                </section>

                {POLICY_AND_COMPLIANCE.subsections.map((sub, index) => (
                    <section key={index} style={{ marginBottom: '30px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'normal', marginBottom: '15px' }}>
                            {sub.title}
                        </h2>

                        {sub.content && <p style={{ lineHeight: '1.6', color: '#555' }}>{sub.content}</p>}

                        {sub.list && (
                            <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
                                {sub.list.map((item, i) => (
                                    <li key={i} style={{ marginBottom: '10px' }}>
                                        <strong>{item.bold}:</strong> {item.description}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </div>
    ); 
}