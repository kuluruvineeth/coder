import type {
	CreateTemplateVersionRequest,
	TemplateVersion,
	TemplateVersionVariable,
} from "api/typesGenerated";
import { Alert } from "components/Alert/Alert";
import { ErrorAlert } from "components/Alert/ErrorAlert";
import { PageHeader, PageHeaderTitle } from "components/PageHeader/PageHeader";
import { Stack } from "components/Stack/Stack";
import type { ComponentProps, FC } from "react";
import { TemplateVariablesForm } from "./TemplateVariablesForm";

interface TemplateVariablesPageViewProps {
	templateVersion?: TemplateVersion;
	templateVariables?: TemplateVersionVariable[];
	onSubmit: (data: CreateTemplateVersionRequest) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	errors?: {
		/**
		 * Failed to build a new template version
		 */
		buildError?: unknown;
		/**
		 * New version was created successfully, but publishing it failed
		 */
		publishError?: unknown;
	};
	initialTouched?: ComponentProps<
		typeof TemplateVariablesForm
	>["initialTouched"];
}

export const TemplateVariablesPageView: FC<TemplateVariablesPageViewProps> = ({
	templateVersion,
	templateVariables,
	onCancel,
	onSubmit,
	isSubmitting,
	errors = {},
	initialTouched,
}) => {
	const hasError = Object.values(errors).some((error) => Boolean(error));

	return (
		<>
			<PageHeader css={{ paddingTop: 0 }}>
				<PageHeaderTitle>Template variables</PageHeaderTitle>
			</PageHeader>
			{hasError && (
				<Stack css={{ marginBottom: 64 }}>
					{Boolean(errors.buildError) && (
						<ErrorAlert error={errors.buildError} />
					)}
					{Boolean(errors.publishError) && (
						<ErrorAlert error={errors.publishError} />
					)}
				</Stack>
			)}
			{templateVersion && templateVariables && templateVariables.length > 0 && (
				<TemplateVariablesForm
					initialTouched={initialTouched}
					isSubmitting={isSubmitting}
					templateVersion={templateVersion}
					templateVariables={templateVariables}
					onSubmit={onSubmit}
					onCancel={onCancel}
					error={errors.buildError}
				/>
			)}
			{templateVariables && templateVariables.length === 0 && (
				<Alert severity="info">
					This template does not use managed variables.
				</Alert>
			)}
		</>
	);
};
