import React, { useEffect } from 'react'
/* global browser */
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}
function useTheme() {
    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")

        const applyTheme = async (layout) => {
            let customTheme = layout?.customTheme
            let theme = layout?.theme

            if (!theme) return;

            if (theme?.active === 'system') {
                const mode = prefersDark ? 'dark' : 'light'
                document.documentElement.setAttribute('data-theme', mode)

                if (theme[mode]) {
                    Object.entries(theme[mode]).forEach(([key, value]) => {
                        document.documentElement.style.setProperty(`--${key}`, value)
                    })
                }
                return;
            }

            if (customTheme[theme?.active]) {
                Object.entries(customTheme[theme?.active]).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(`--${key}`, value)
                })

                return;
            }

            if (theme[theme?.active]) {
                Object.entries(theme[theme.active]).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(`--${key}`, value)
                })

                return;
            }


        }

        const loadTheme = async () => {
            await browser?.storage?.local?.get("settings", (res) => {
                applyTheme(res?.settings?.Layout);
            });
        };

        loadTheme();

        browser.storage.onChanged.addListener((changes, area) => {
            if (area == 'local' && changes.settings) {
                const layout = changes.settings.newValue.Layout;
                applyTheme(layout);
            }
        })

        prefersDark.addEventListener("change", () => {
            loadTheme(); // reloads for u
        });
    }, [])
}

export default useTheme;