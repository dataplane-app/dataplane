export function formatSpecialPermission(permission) {
    const pipelineOrDeployment = permission.Label.split(' ')[0].replace('-', '');
    const name = permission.PipelineName || permission.FirstName;
    const access = `[${permission.Access.replaceAll(',', ', ')}]`;
    const accessGroupName = permission.Subject === 'access_group' ? ` (${permission.FirstName})` : '';
    return pipelineOrDeployment + ' ' + name + ' ' + access + accessGroupName;
}
