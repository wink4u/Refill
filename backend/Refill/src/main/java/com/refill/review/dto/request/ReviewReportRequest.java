package com.refill.review.dto.request;

import javax.validation.constraints.NotNull;

public record ReviewReportRequest(
    @NotNull String content
) {

}
