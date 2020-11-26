export interface InterfacePort {
    interface: string;
    port: number;
}

export interface Stats {
    version: string;
    urlCount: number;
    htmlCount: number;
    totalCount: number;
}

export interface ScreenshotOptions {
    omitBackground: boolean;
    type: "jpeg" | "png";
    quality?: number;
}

export interface Body {
    url?: string;
    html?: string;

    width?: string;
    height?: string;

    imageFormat?: string;
    quality?: string;
}

export interface TemplateBodyContext extends Body {
    context?: any;
}

export interface TemplateBodyName extends TemplateBodyContext {
    templateName: string;
}

export interface TemplateBodyString extends TemplateBodyContext {
    templateString: string;
}

export type TemplateBody = TemplateBodyName | TemplateBodyString;

export interface Dimensions {
    width: number;
    height: number;
}

export type Dimension = "width" | "height";

export type ImageFormat = "png" | "jpeg";

export type ResponseType = "image/png" | "image/jpeg";
