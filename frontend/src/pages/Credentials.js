import React from "react";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

const Credentials = () => {
  const location = useLocation();
  const credentialId = location.state?.fieldValue;

  return (
    <Box component="main" aria-label="Credentials page">
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Credentials
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Credential verification UI can be expanded here. For now this page
        accepts QR-scanned credential IDs so the scanner flow has a valid target.
      </Typography>

      <Card>
        <CardContent>
          {credentialId ? (
            <Alert severity="info">
              QR-scanned credential ID: {credentialId}
            </Alert>
          ) : (
            <Alert severity="warning">
              No credential ID was provided yet. Scan a credential QR code from
              the QR tools page to prefill this view.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Credentials;
