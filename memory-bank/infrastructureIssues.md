# Infrastructure Issues: Dazzer CLI NPM Package

## CRITICAL ISSUE: GCS Bucket Permissions

### Problem Summary
- **Date Discovered**: September 1, 2025
- **Issue**: HTTP 403 Forbidden when downloading binaries from Google Cloud Storage
- **Impact**: Complete installation failure for all users
- **Status**: UNRESOLVED - Blocking all testing and deployment

### Technical Details

#### Error Message
```
❌ Installation failed: Failed to download: HTTP 403
```

#### Full GCS Error Response
```xml
<?xml version='1.0' encoding='UTF-8'?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Access denied.</Message>
  <Details>Anonymous caller does not have storage.objects.get access to the Google Cloud Storage object. Permission 'storage.objects.get' denied on resource (or it may not exist).</Details>
</Error>
```

#### Failing URL
```
https://storage.googleapis.com/dazzer-asts-prod/binaries/v0.1.0/dazzer-darwin-arm64
```

### Root Cause Analysis

1. **GCS Bucket Exists**: The bucket `dazzer-asts-prod` exists (confirmed via API response)
2. **Permissions Missing**: Bucket does not have public read permissions configured
3. **Anonymous Access Required**: NPM installation requires anonymous download access
4. **Infrastructure Gap**: Bucket was created but not configured for public distribution

### Resolution Steps

#### Option 1: Google Cloud Console (Web UI)
1. Navigate to [GCS Console](https://console.cloud.google.com/storage/browser/dazzer-asts-prod)
2. Select the `dazzer-asts-prod` bucket
3. Click "Permissions" tab
4. Click "Add Principal"
5. Principal: `allUsers`
6. Role: `Storage Object Viewer`
7. Click "Save"

#### Option 2: gcloud CLI (Recommended)
```bash
# Make entire bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://dazzer-asts-prod

# Alternative: Make only binaries directory public
gsutil iam ch allUsers:objectViewer gs://dazzer-asts-prod/binaries/**
```

#### Option 3: Terraform/Infrastructure as Code
```hcl
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = "dazzer-asts-prod"
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
```

### Verification Steps

After applying permissions fix:

1. **Test Download URL**:
   ```bash
   curl -I "https://storage.googleapis.com/dazzer-asts-prod/binaries/v0.1.0/dazzer-darwin-arm64"
   # Should return: HTTP/2 200
   ```

2. **Test NPM Installation**:
   ```bash
   npm install -g dazzer-cli
   # Should complete successfully
   ```

3. **Verify Binary Works**:
   ```bash
   dazzer --version
   # Should return version number
   ```

### Additional Checks Required

#### Verify Binaries Exist
Ensure all platform binaries are uploaded:
- `dazzer-darwin-amd64`
- `dazzer-darwin-arm64`
- `dazzer-linux-amd64`
- `dazzer-linux-arm64`
- `dazzer-windows-amd64.exe`
- `dazzer-windows-386.exe`

#### Check API Endpoints
Verify supporting infrastructure:
```bash
# Version API
curl https://api.dazzer.io/version
# Should return: 0.1.0

# Analytics endpoint (optional test)
curl -X POST https://api.dazzer.io/analytics/install \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Should return: 200 OK
```

### Impact Assessment

#### Current State
- ❌ NPM package completely non-functional
- ❌ No users can install via `npm install -g dazzer-cli`
- ❌ All testing blocked
- ❌ Cannot publish to NPM registry

#### Post-Fix State
- ✅ NPM installation will work globally
- ✅ All platforms supported
- ✅ Ready for NPM publishing
- ✅ User adoption can begin

### Timeline
- **Discovery**: September 1, 2025 14:17 UTC
- **Documentation**: September 1, 2025 14:21 UTC
- **Resolution**: PENDING - Infrastructure team action required
- **Verification**: PENDING - After permissions fix
- **Deployment**: PENDING - After verification complete

### Lessons Learned
1. **Infrastructure First**: GCS bucket permissions should be configured before NPM package development
2. **End-to-End Testing**: Need to test actual binary downloads, not just package logic
3. **CI/CD Integration**: Binary upload and permission setup should be automated
4. **Monitoring**: Need alerts for GCS bucket access issues

### Next Actions
1. **IMMEDIATE**: Fix GCS bucket permissions using one of the methods above
2. **SHORT-TERM**: Verify all v0.1.0 binaries are uploaded and accessible
3. **MEDIUM-TERM**: Implement automated infrastructure setup
4. **LONG-TERM**: Add monitoring and alerting for binary distribution
