### Testing Permissions

For adding in scenarios, look in the Tests folder > permissions > scenarios_logic_test.go


### Add to list permissions
Only seen issues with too restrictive, not situations where permissions were not granted and the user could perform actions they dont have access to.

Usually as a result of: ResourceID: platformID

1. View all pipelines in Access Group [FIXED]
2. Edit all pipelines in Access Group - could edit pipeline, could run pipelne, not edit code