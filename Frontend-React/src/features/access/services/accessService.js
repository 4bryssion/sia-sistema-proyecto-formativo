import api from "@/shared/services/axiosInstance";

const accessService = {
  async getUserGroups(userId) {
    const { data } = await api.get(`/access/${userId}/groups`);
    return data;
  },

  async assignGroup(userId, groupId) {
    const { data } = await api.post(`/access/${userId}/groups`, { groupId });
    return data;
  },

  async removeGroup(userId, groupId) {
    const { data } = await api.delete(`/access/${userId}/groups/${groupId}`);
    return data;
  },

  async getUserPermissions(userId) {
    const { data } = await api.get(`/access/${userId}/permissions`);
    return data;
  },

  async assignPermission(userId, permissionId) {
    const { data } = await api.post(`/access/${userId}/permissions`, { permissionId });
    return data;
  },

  async removePermission(userId, permissionId) {
    const { data } = await api.delete(`/access/${userId}/permissions/${permissionId}`);
    return data;
  },

  // P36: check si el usuario del token tiene un permiso por codename
  async check(permissionCode) { const { data } = await api.get(`/access/check/${permissionCode}`); return data.granted; },
};

export default accessService;
