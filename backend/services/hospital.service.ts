import { findAllHospitals, findHospitalById, updateHospital } from "../repositories/hospital.repo";

export const getHospitalDetailsService = async (id: string) => {
  return await findHospitalById(id);
};

export const listHospitalsService = async () => {
  return await findAllHospitals();
};

export const updateHospitalService = async (id: string, data: any) => {
  return await updateHospital(id, data);
};
