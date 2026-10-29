import './globals.css'

import { StyledEngineProvider } from "@mui/material";
import StoreProvideLayout from '@/layout/store/provider';
import SnackBarLayout from '@/layout/snackbar/snackbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      <body>
        <StyledEngineProvider injectFirst>
          <StoreProvideLayout >
            <SnackBarLayout>
              {children}
            </SnackBarLayout>
          </StoreProvideLayout >
        </StyledEngineProvider>
      </body>
    </html >
  );
}
