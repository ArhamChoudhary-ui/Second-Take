import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Second Take — Change your mind. Keep control.",description:"Preview, correct, and recover conversational bookings. An Alexa+ experience simulation.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
