export type NodeCategory = "source" | "transform" | "sink";

export type NodeTypeId =
  | "apache_logs"
  | "apache_parser"
  | "apache_sampler"
  | "es_cluster"
  | "s3_archives";

export type FormFieldKind = "text" | "number" | "textarea";

export type FormField =
  | {
      kind: "text";
      name: string;
      label: string;
      defaultValue: string;
      placeholder?: string;
    }
  | {
      kind: "number";
      name: string;
      label: string;
      defaultValue: number;
      min?: number;
      step?: number;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      defaultValue: string;
      placeholder?: string;
      rows?: number;
    };

export type NodeFormValues = Record<string, string | number>;

export type BuildVectorConfig = (args: {
  inputs: string[];
  formValues: NodeFormValues;
}) => Record<string, unknown>;

export interface NodeDefinition {
  typeId: NodeTypeId;
  category: NodeCategory;
  vectorType: string;
  iconClass: string;
  allowedInputFromNodeTypeIds: NodeTypeId[]; // empty for sources
  defaultInstanceName: string; // suggestion for `data.name`
  defaultFormValues: NodeFormValues;
  formFields: FormField[];
  buildVectorConfig: BuildVectorConfig;
}

export const nodeRegistry: Record<NodeTypeId, NodeDefinition> = {
  apache_logs: {
    typeId: "apache_logs",
    category: "source",
    vectorType: "file",
    iconClass: "ri-file-list-3-line",
    allowedInputFromNodeTypeIds: [],
    defaultInstanceName: "apache_logs",
    defaultFormValues: {
      include_glob: "/var/log/apache2/*.log",
      ignore_older: 86400,
    },
    formFields: [
      {
        kind: "text",
        name: "include_glob",
        label: "Include glob",
        defaultValue: "/var/log/apache2/*.log",
      },
      {
        kind: "number",
        name: "ignore_older",
        label: "Ignore older (seconds)",
        defaultValue: 86400,
        min: 0,
        step: 1,
      },
    ],
    buildVectorConfig: ({ formValues }) => {
      return {
        type: "file",
        include: [String(formValues.include_glob)],
        ignore_older: Number(formValues.ignore_older),
      };
    },
  },

  apache_parser: {
    typeId: "apache_parser",
    category: "transform",
    vectorType: "remap",
    iconClass: "ri-code-box-line",
    allowedInputFromNodeTypeIds: ["apache_logs"],
    defaultInstanceName: "apache_parser",
    defaultFormValues: {
      vrl_source: ". = parse_apache_log(.message)",
    },
    formFields: [
      {
        kind: "textarea",
        name: "vrl_source",
        label: "VRL source",
        defaultValue: ". = parse_apache_log(.message)",
        rows: 4,
        placeholder: ". = parse_apache_log(.message)",
      },
    ],
    buildVectorConfig: ({ inputs, formValues }) => {
      return {
        type: "remap",
        inputs,
        source: String(formValues.vrl_source),
      };
    },
  },

  apache_sampler: {
    typeId: "apache_sampler",
    category: "transform",
    vectorType: "sample",
    iconClass: "ri-filter-3-line",
    allowedInputFromNodeTypeIds: ["apache_parser"],
    defaultInstanceName: "apache_sampler",
    defaultFormValues: {
      rate: 50,
    },
    formFields: [
      {
        kind: "number",
        name: "rate",
        label: "Sample rate",
        defaultValue: 50,
        min: 0,
        step: 1,
      },
    ],
    buildVectorConfig: ({ inputs, formValues }) => {
      return {
        type: "sample",
        inputs,
        rate: Number(formValues.rate),
      };
    },
  },

  es_cluster: {
    typeId: "es_cluster",
    category: "sink",
    vectorType: "elasticsearch",
    iconClass: "ri-database-2-line",
    allowedInputFromNodeTypeIds: ["apache_sampler"],
    defaultInstanceName: "es_cluster",
    defaultFormValues: {
      endpoints_csv: "http://79.12.221.222:9200",
      bulk_index: "vector-%Y-%m-%d",
    },
    formFields: [
      {
        kind: "text",
        name: "endpoints_csv",
        label: "Elasticsearch endpoints (comma-separated)",
        defaultValue: "http://79.12.221.222:9200",
      },
      {
        kind: "text",
        name: "bulk_index",
        label: "Bulk index name",
        defaultValue: "vector-%Y-%m-%d",
      },
    ],
    buildVectorConfig: ({ inputs, formValues }) => {
      const endpoints = String(formValues.endpoints_csv)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return {
        type: "elasticsearch",
        inputs,
        endpoints,
        bulk: {
          index: String(formValues.bulk_index),
        },
      };
    },
  },

  s3_archives: {
    typeId: "s3_archives",
    category: "sink",
    vectorType: "aws_s3",
    iconClass: "ri-cloud-line",
    allowedInputFromNodeTypeIds: ["apache_parser"],
    defaultInstanceName: "s3_archives",
    defaultFormValues: {
      region: "us-east-1",
      bucket: "my-log-archives",
      key_prefix: "date=%Y-%m-%d",
      compression: "gzip",
      framing_method: "newline_delimited",
      encoding_codec: "json",
      batch_max_bytes: 10000000,
    },
    formFields: [
      { kind: "text", name: "region", label: "Region", defaultValue: "us-east-1" },
      { kind: "text", name: "bucket", label: "Bucket", defaultValue: "my-log-archives" },
      {
        kind: "text",
        name: "key_prefix",
        label: "Key prefix",
        defaultValue: "date=%Y-%m-%d",
      },
      {
        kind: "text",
        name: "compression",
        label: "Compression",
        defaultValue: "gzip",
      },
      {
        kind: "text",
        name: "framing_method",
        label: "Framing method",
        defaultValue: "newline_delimited",
      },
      {
        kind: "text",
        name: "encoding_codec",
        label: "Encoding codec",
        defaultValue: "json",
      },
      {
        kind: "number",
        name: "batch_max_bytes",
        label: "Batch max bytes",
        defaultValue: 10000000,
        min: 0,
        step: 1000,
      },
    ],
    buildVectorConfig: ({ inputs, formValues }) => {
      return {
        type: "aws_s3",
        inputs,
        region: String(formValues.region),
        bucket: String(formValues.bucket),
        key_prefix: String(formValues.key_prefix),
        compression: String(formValues.compression),
        framing: {
          method: String(formValues.framing_method),
        },
        encoding: {
          codec: String(formValues.encoding_codec),
        },
        batch: {
          max_bytes: Number(formValues.batch_max_bytes),
        },
      };
    },
  },
};

export const nodeTypeIds = Object.keys(nodeRegistry) as NodeTypeId[];

