import React, { useEffect, useRef } from 'react';

// This view embeds the agency Finance Hub (dev server) inside the org app.
// It provides an easy integration while a full native port is performed.

const FINANCE_HUB_URL = 'http://localhost:5175/embed/finance?embed=1';

const FinanceView = () => {
    const iframeRef = useRef(null);

    useEffect(() => {
        const handler = (ev) => {
            try {
                const data = ev.data || {};
                if (data && data.type === 'finance-height' && iframeRef.current) {
                    // Instead of using the child-reported height (which can be larger
                    // than the available viewport), size the iframe to its parent
                    // container's clientHeight so the org page handles scrolling.
                    const parentEl = iframeRef.current.parentElement;
                    if (parentEl) {
                        const availH = parentEl.clientHeight || window.innerHeight;
                        iframeRef.current.style.height = availH + 'px';
                    }
                }
            } catch (e) {
                // ignore
            }
        };
        window.addEventListener('message', handler);
        const resizeHandler = () => {
            if (iframeRef.current) {
                const parentEl = iframeRef.current.parentElement;
                if (parentEl) iframeRef.current.style.height = (parentEl.clientHeight || window.innerHeight) + 'px';
            }
        };
        window.addEventListener('resize', resizeHandler);
        return () => window.removeEventListener('message', handler);
    }, []);

    return (
        <div style={{ width: '100%' }}>
            <iframe
                ref={iframeRef}
                title="Finance Hub"
                src={FINANCE_HUB_URL}
                style={{ width: '100%', height: '800px', border: '0', display: 'block' }}
                scrolling="no"
                allowFullScreen
            />
        </div>
    );
};

export default FinanceView;
