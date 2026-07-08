import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-muted overflow-x-auto rounded-md p-4 font-mono text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

const EXAMPLE_BODY = `[
  {
    "level": "INFO",
    "host": "servidor-01",
    "logs": [
      {
        "time": "2026-07-08T14:30:00Z",
        "content": "Aplicação iniciada com sucesso",
        "metadata": {
          "modulo": "startup",
          "versao": "1.4.2"
        }
      },
      {
        "content": {
          "evento": "pedido_criado",
          "pedidoId": 12345
        }
      }
    ]
  },
  {
    "level": "ERROR",
    "logs": [
      {
        "time": "1751985000",
        "content": "Falha ao conectar ao banco de dados",
        "metadata": {
          "tentativa": "3"
        }
      }
    ]
  }
]`;

const EXAMPLE_CURL = `curl -X POST https://<seu-dominio>/api/log \\
  -H "Authorization: Bearer <seu-token>" \\
  -H "Content-Type: application/json" \\
  -d '[
    {
      "level": "INFO",
      "logs": [
        { "content": "Aplicação iniciada com sucesso" }
      ]
    }
  ]'`;

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Documentação da API</h1>
        <p className="text-muted-foreground text-sm">
          Como enviar logs para o servidor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge>POST</Badge>
            <span className="font-mono text-base">/api/log</span>
          </CardTitle>
          <CardDescription>
            Recebe um lote de logs e o encaminha ao Loki. A aplicação de
            destino é resolvida pelo token — não é enviada no corpo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            A autenticação usa o token de log da aplicação (crie um na página
            “Tokens de Log”), enviado de uma destas formas:
          </p>
          <CodeBlock>{`Authorization: Bearer <seu-token>\n# ou\nx-log-token: <seu-token>`}</CodeBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Corpo da requisição</CardTitle>
          <CardDescription>
            Um array de streams de log (JSON). Cada stream agrupa logs de um
            mesmo nível.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Obrigatório</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">level</TableCell>
                <TableCell className="font-mono text-xs">string</TableCell>
                <TableCell>Sim</TableCell>
                <TableCell>
                  <span className="font-mono text-xs">
                    INFO | WARNING | ERROR | CRITICAL
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">host</TableCell>
                <TableCell className="font-mono text-xs">string</TableCell>
                <TableCell>Não</TableCell>
                <TableCell>Identifica a máquina de origem.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">logs</TableCell>
                <TableCell className="font-mono text-xs">Log[]</TableCell>
                <TableCell>Sim</TableCell>
                <TableCell>Ao menos um log por stream.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">
                  logs[].content
                </TableCell>
                <TableCell className="font-mono text-xs">
                  string | object
                </TableCell>
                <TableCell>Sim</TableCell>
                <TableCell>
                  A mensagem do log. Objetos são serializados em JSON.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">
                  logs[].time
                </TableCell>
                <TableCell className="font-mono text-xs">string</TableCell>
                <TableCell>Não</TableCell>
                <TableCell>
                  Timestamp unix (somente dígitos — segundos, ms, µs ou ns) ou
                  data ISO-8601. Ausente = horário do servidor.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">
                  logs[].metadata
                </TableCell>
                <TableCell className="font-mono text-xs">
                  object
                </TableCell>
                <TableCell>Não</TableCell>
                <TableCell>
                  Pares chave/valor (valores string). Consultável no Grafana.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Exemplo de corpo</p>
            <CodeBlock>{EXAMPLE_BODY}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exemplo com curl</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock>{EXAMPLE_CURL}</CodeBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Respostas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Significado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">204</TableCell>
                <TableCell>Logs aceitos pelo Loki.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">400</TableCell>
                <TableCell>
                  JSON inválido ou corpo fora do contrato (o erro indica o
                  campo).
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">401</TableCell>
                <TableCell>Token ausente, inválido ou órfão.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">500</TableCell>
                <TableCell>Loki não configurado no servidor.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">502</TableCell>
                <TableCell>Falha ao alcançar o Loki.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
