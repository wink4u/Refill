package com.refill.admin.dto.response;

import com.refill.hospital.entity.Hospital;

public record WaitingHospitalResponse (
    Long id,
    String loginId,
    String name,
    String address,
    String tel,
    String email,
    String hospitalProfileImg,
    String registrationImg

) {

    public WaitingHospitalResponse(Hospital hospital) {
        this(
            hospital.getId(),
            hospital.getLoginId(),
            hospital.getName(),
            hospital.getAddress(),
            hospital.getTel(),
            hospital.getEmail(),
            hospital.getHospitalProfileImg(),
            hospital.getRegistrationImg()
        );
    }
}
