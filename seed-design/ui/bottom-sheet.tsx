/**
 * @file ui:bottom-sheet
 * @requires @seed-design/react@~1.1.0
 * @requires @seed-design/css@~1.1.0
 **/

import IconXmarkLine from "@karrotmarket/react-monochrome-icon/IconXmarkLine";
import { Icon, BottomSheet as SeedBottomSheet, VisuallyHidden } from "@seed-design/react";
import type * as React from "react";
import { forwardRef } from "react";

export interface BottomSheetRootProps extends SeedBottomSheet.RootProps {}

/**
 * @see https://seed-design.io/react/components/action-sheet
 */
export const BottomSheetRoot = (props: BottomSheetRootProps) => {
  const { children, ...otherProps } = props;
  return <SeedBottomSheet.Root {...otherProps}>{children}</SeedBottomSheet.Root>;
};

export interface BottomSheetTriggerProps extends SeedBottomSheet.TriggerProps {}

export const BottomSheetTrigger = SeedBottomSheet.Trigger;

export interface BottomSheetContentProps extends Omit<SeedBottomSheet.ContentProps, "title"> {
  title?: React.ReactNode;

  description?: React.ReactNode;

  layerIndex?: number;

  /**
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * @default false
   */
  showHandle?: boolean;
}

/**
 * SEED Handle은 position:absolute라 레이아웃 높이를 쓰지 않는다.
 * Header(title)가 없으면 Header의 padding-top(x6)과 동일한 여백을 넣어
 * Handle·본문 겹침을 막는다.
 */
function BottomSheetHandleClearance() {
  return (
    <div
      aria-hidden
      style={{
        flexShrink: 0,
        height: "var(--seed-dimension-x6)",
      }}
    />
  );
}

export const BottomSheetContent = forwardRef<HTMLDivElement, BottomSheetContentProps>(
  (
    {
      children,
      title,
      description,
      layerIndex,
      showCloseButton = true,
      showHandle = false,
      ...otherProps
    },
    ref,
  ) => {
    if (
      !title &&
      !otherProps["aria-labelledby"] &&
      !otherProps["aria-label"] &&
      import.meta.env.DEV
    ) {
      console.warn(
        "BottomSheetContent: aria-labelledby or aria-label should be provided if title is not provided.",
      );
    }

    const shouldRenderHeader = Boolean(title || description);
    const needsHandleClearance = showHandle && !shouldRenderHeader;

    return (
      <SeedBottomSheet.Positioner style={{ "--layer-index": layerIndex } as React.CSSProperties}>
        <SeedBottomSheet.Backdrop />
        <SeedBottomSheet.Content ref={ref} {...otherProps}>
          {showHandle && <SeedBottomSheet.Handle />}
          {needsHandleClearance && <BottomSheetHandleClearance />}
          {shouldRenderHeader && (
            <SeedBottomSheet.Header>
              {title ? (
                <SeedBottomSheet.Title>{title}</SeedBottomSheet.Title>
              ) : (
                <VisuallyHidden asChild>
                  <SeedBottomSheet.Title>{otherProps["aria-label"] || ""}</SeedBottomSheet.Title>
                </VisuallyHidden>
              )}
              {description && (
                <SeedBottomSheet.Description>{description}</SeedBottomSheet.Description>
              )}
            </SeedBottomSheet.Header>
          )}
          {children}
          {showCloseButton && (
            // You may implement your own i18n for dismiss label
            <SeedBottomSheet.CloseButton aria-label="닫기">
              <Icon svg={<IconXmarkLine />} />
            </SeedBottomSheet.CloseButton>
          )}
        </SeedBottomSheet.Content>
      </SeedBottomSheet.Positioner>
    );
  },
);

export interface BottomSheetBodyProps extends SeedBottomSheet.BodyProps {}

export const BottomSheetBody = SeedBottomSheet.Body;

export interface BottomSheetFooterProps extends SeedBottomSheet.FooterProps {}

export const BottomSheetFooter = SeedBottomSheet.Footer;

/**
 * This file is a snippet from SEED Design, helping you get started quickly with @seed-design/* packages.
 * You can extend this snippet however you want.
 */
