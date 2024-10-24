import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentFacade } from '../../application/facades/payment.facade';
import { PaymentDto } from '../dto/payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentFacade: PaymentFacade) {}

  /**
   * 결제 처리 API
   * 사용자가 요청한 결제를 처리하고, 결제가 완료되면 좌석 소유권을 배정합니다.
   * @param paymentDto - 결제 관련 정보 (사용자 ID, 좌석 ID 등)
   * @returns 성공 시, 결제 내역을 반환합니다.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async processPayment(@Body() paymentDto: PaymentDto) {
    const paymentResult = await this.paymentFacade.processPayment(paymentDto);
    return {
      message: '결제가 성공적으로 처리되었습니다.',
      data: paymentResult,
    };
  }
}
