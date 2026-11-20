import { REGEXP_ONLY_DIGITS } from 'input-otp'
import type { ComponentProps } from 'react'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@shared/components/ui/input-otp'

type AuthenticatorCodeInputProps = Pick<
  ComponentProps<typeof InputOTP>,
  | 'id'
  | 'name'
  | 'value'
  | 'onChange'
  | 'autoFocus'
  | 'disabled'
  | 'required'
  | 'containerClassName'
>

export function AuthenticatorCodeInput(props: AuthenticatorCodeInputProps) {
  return (
    <InputOTP
      {...props}
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
    >
      <InputOTPGroup aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="size-10 font-mono text-lg sm:size-11"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
