# DTS-1597 Debug/Resolution Prompt Template (Grafana Datasource UID Binding)

Use this prompt with a coding agent to diagnose and fix Grafana dashboard datasource binding issues where dashboards require manual datasource selection in the UI.

## Prompt

You are resolving a Grafana provisioning issue where dashboards are not binding to the intended datasource automatically.

### Inputs
- Linear issue: DTS-1597
- Symptom: Multiple dashboards require datasource UID assignment in Grafana UI
- Stack: Docker Compose monitoring stack with Grafana + Prometheus

### Objectives
1. Identify why dashboards are not auto-binding to datasource.
2. Implement a durable GitOps fix (no manual UI binding).
3. Validate the fix with lint/tests and runtime checks.
4. Document root cause and verification evidence.

### Required Technical Guidance (Grafana docs aligned)
- Use Grafana provisioning for datasources (`provisioning/datasources/*.yml`) with explicit `uid`.
- Use Grafana provisioning for dashboards (`provisioning/dashboards/*.yml`) that points to dashboard JSON path.
- Ensure each panel/dashboard datasource references the provisioned datasource uid.
- Use UID format that only includes latin letters, numbers, and dashes.

### Execution Steps
1. Inspect monitoring configuration:
   - `docker-compose.monitoring.yml`
   - `monitoring/grafana-dashboard.json` (and any other dashboards)
   - existing `monitoring/*.yml` provisioning files
2. Root-cause check:
   - Verify whether datasource provisioning file exists.
   - Verify whether dashboard provider provisioning exists.
   - Verify whether dashboards reference a datasource uid that matches a provisioned datasource.
3. Implement fixes:
   - Create/update datasource provisioning yaml with stable uid (for Prometheus).
   - Create/update dashboard provider provisioning yaml with dashboard directory path.
   - Update dashboard JSON to reference the same datasource uid and include overwrite metadata where needed.
   - Update Docker Compose mounts so Grafana loads:
     - datasource provisioning file
     - dashboard provider provisioning file
     - dashboard JSON in provider path
4. Validate:
   - Start/restart monitoring stack and ensure Grafana loads without provisioning errors.
   - Check Grafana logs for datasource/dashboard provisioning success.
   - Run repo lint and tests relevant to touched code.
5. Output:
   - Root cause summary
   - Files changed
   - Validation commands + outcomes
   - Residual risks and next checks

### Suggested Commands
```bash
docker-compose -f docker-compose.monitoring.yml up -d grafana prometheus
docker logs grafana --tail 200
```

Run the project’s eslint/test commands appropriate to the changed areas and include results.

### Definition of Done
- Dashboards bind to provisioned datasource with no manual UI datasource assignment.
- Provisioning config and dashboard JSON are committed to source control.
- Lint/tests executed and results reported.
