"use client";

import Link from "next/link";
import Logo from "../components/logo";

import { useState } from "react";

export const PRIVACYPOLICY ={
    title: "PRIVACY POLICY",
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

export default function PrivacyPolicyPage() {
    return (
        <div style = {{background: '#ffffff', width: '100%'}}> 
            

            <div style={{ width: '100%', marginBottom: '60px', background: '#ffffff', color: '#333' }}>
                <section style={{ width: '100%', background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Privacy Policy</h1>
                    <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>About our privacy policy.</p>
                </section>

                {PRIVACYPOLICY.subsections.map((sub, index) => (
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