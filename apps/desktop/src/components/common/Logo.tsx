import { Box, type BoxProps } from "@mui/material";
import logoMask from "../../assets/anime-logo-mask.png";

export type LogoProps = BoxProps;

export const Logo = ({
  sx,
  width = "1.3rem",
  height = "2.2rem",
  ...rest
}: LogoProps) => {
  return (
    <Box
      width={width}
      height={height}
      sx={{
        display: "inline-block",
        flexShrink: 0,
        backgroundColor: "currentColor",
        color: "primary.main",
        maskImage: `url(${logoMask})`,
        WebkitMaskImage: `url(${logoMask})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        ...sx,
      }}
      {...rest}
    />
  );
};
